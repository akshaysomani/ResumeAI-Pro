"use server";

import { db } from "@/lib/db";
import crypto from "crypto";
import type { CareerDocument, DocumentFolder, CareerDocumentVersion, CareerDocumentShare } from "@/types";

/**
 * Hash a password using SHA-256 for secure sharing comparison.
 */
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// ==========================================
// 1. FOLDER OPERATIONS
// ==========================================

export async function getFoldersAction(userId: string): Promise<DocumentFolder[]> {
  try {
    const query = `
      SELECT id, user_id as "userId", name, color, created_at as "createdAt", updated_at as "updatedAt"
      FROM public.document_folders
      WHERE user_id = $1
      ORDER BY name ASC
    `;
    const { rows } = await db.query(query, [userId]);
    return rows;
  } catch (error) {
    console.error("Error fetching document folders:", error);
    return [];
  }
}

export async function createFolderAction(userId: string, name: string, color: string): Promise<DocumentFolder | null> {
  try {
    const query = `
      INSERT INTO public.document_folders (user_id, name, color)
      VALUES ($1, $2, $3)
      RETURNING id, user_id as "userId", name, color, created_at as "createdAt", updated_at as "updatedAt"
    `;
    const { rows } = await db.query(query, [userId, name.trim(), color]);
    return rows[0] || null;
  } catch (error: any) {
    console.error("Error creating folder:", error);
    throw new Error(error.message || "Failed to create folder.");
  }
}

export async function deleteFolderAction(userId: string, folderId: string): Promise<boolean> {
  try {
    const query = `
      DELETE FROM public.document_folders
      WHERE id = $1 AND user_id = $2
    `;
    const { rowCount } = await db.query(query, [folderId, userId]);
    return (rowCount ?? 0) > 0;
  } catch (error) {
    console.error("Error deleting folder:", error);
    return false;
  }
}

// ==========================================
// 2. DOCUMENT OPERATIONS
// ==========================================

export async function getDocumentsAction(userId: string): Promise<(CareerDocument & { folderName?: string; folderColor?: string })[]> {
  try {
    const query = `
      SELECT d.id, d.user_id as "userId", d.resume_id as "resumeId", d.folder_id as "folderId",
             d.document_type as "documentType", d.title, d.content, d.meta_config as "metaConfig",
             d.is_favorite as "isFavorite", d.is_pinned as "isPinned", d.is_archived as "isArchived",
             d.is_draft as "isDraft", d.tags, d.created_at as "createdAt", d.updated_at as "updatedAt",
             f.name as "folderName", f.color as "folderColor"
      FROM public.career_documents d
      LEFT JOIN public.document_folders f ON d.folder_id = f.id
      WHERE d.user_id = $1
      ORDER BY d.is_pinned DESC, d.updated_at DESC
    `;
    const { rows } = await db.query(query, [userId]);
    return rows;
  } catch (error) {
    console.error("Error fetching documents:", error);
    return [];
  }
}

export async function getDocumentByIdAction(userId: string, docId: string): Promise<(CareerDocument & { folderName?: string; folderColor?: string }) | null> {
  try {
    const query = `
      SELECT d.id, d.user_id as "userId", d.resume_id as "resumeId", d.folder_id as "folderId",
             d.document_type as "documentType", d.title, d.content, d.meta_config as "metaConfig",
             d.is_favorite as "isFavorite", d.is_pinned as "isPinned", d.is_archived as "isArchived",
             d.is_draft as "isDraft", d.tags, d.created_at as "createdAt", d.updated_at as "updatedAt",
             f.name as "folderName", f.color as "folderColor"
      FROM public.career_documents d
      LEFT JOIN public.document_folders f ON d.folder_id = f.id
      WHERE d.id = $1 AND d.user_id = $2
      LIMIT 1
    `;
    const { rows } = await db.query(query, [docId, userId]);
    return rows[0] || null;
  } catch (error) {
    console.error("Error fetching document by id:", error);
    return null;
  }
}

export async function createDocumentAction(
  userId: string,
  data: {
    title: string;
    documentType: string;
    resumeId?: string | null;
    folderId?: string | null;
    content: string;
    metaConfig: any;
  }
): Promise<CareerDocument | null> {
  try {
    const query = `
      INSERT INTO public.career_documents (
        user_id, title, document_type, resume_id, folder_id, content, meta_config,
        is_favorite, is_pinned, is_archived, is_draft, tags
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, false, false, false, true, '{}'::text[])
      RETURNING id, user_id as "userId", resume_id as "resumeId", folder_id as "folderId",
                document_type as "documentType", title, content, meta_config as "metaConfig",
                is_favorite as "isFavorite", is_pinned as "isPinned", is_archived as "isArchived",
                is_draft as "isDraft", tags, created_at as "createdAt", updated_at as "updatedAt"
    `;
    const values = [
      userId,
      data.title,
      data.documentType,
      data.resumeId || null,
      data.folderId || null,
      data.content,
      JSON.stringify(data.metaConfig),
    ];
    const { rows } = await db.query(query, values);
    return rows[0] || null;
  } catch (error) {
    console.error("Error creating document:", error);
    return null;
  }
}

export async function updateDocumentAction(
  userId: string,
  docId: string,
  updates: Partial<{
    title: string;
    content: string;
    metaConfig: any;
    folderId: string | null;
    isFavorite: boolean;
    isPinned: boolean;
    isArchived: boolean;
    isDraft: boolean;
    tags: string[];
  }>
): Promise<CareerDocument | null> {
  try {
    // 1. Build dynamic update query
    const setParts: string[] = [];
    const values: any[] = [docId, userId];
    let placeholderIndex = 3;

    if (updates.title !== undefined) {
      setParts.push(`title = $${placeholderIndex++}`);
      values.push(updates.title);
    }
    if (updates.content !== undefined) {
      setParts.push(`content = $${placeholderIndex++}`);
      values.push(updates.content);
    }
    if (updates.metaConfig !== undefined) {
      setParts.push(`meta_config = $${placeholderIndex++}`);
      values.push(JSON.stringify(updates.metaConfig));
    }
    if (updates.folderId !== undefined) {
      setParts.push(`folder_id = $${placeholderIndex++}`);
      values.push(updates.folderId);
    }
    if (updates.isFavorite !== undefined) {
      setParts.push(`is_favorite = $${placeholderIndex++}`);
      values.push(updates.isFavorite);
    }
    if (updates.isPinned !== undefined) {
      setParts.push(`is_pinned = $${placeholderIndex++}`);
      values.push(updates.isPinned);
    }
    if (updates.isArchived !== undefined) {
      setParts.push(`is_archived = $${placeholderIndex++}`);
      values.push(updates.isArchived);
    }
    if (updates.isDraft !== undefined) {
      setParts.push(`is_draft = $${placeholderIndex++}`);
      values.push(updates.isDraft);
    }
    if (updates.tags !== undefined) {
      setParts.push(`tags = $${placeholderIndex++}`);
      values.push(updates.tags);
    }

    if (setParts.length === 0) return null;

    const query = `
      UPDATE public.career_documents
      SET ${setParts.join(", ")}, updated_at = now()
      WHERE id = $1 AND user_id = $2
      RETURNING id, user_id as "userId", resume_id as "resumeId", folder_id as "folderId",
                document_type as "documentType", title, content, meta_config as "metaConfig",
                is_favorite as "isFavorite", is_pinned as "isPinned", is_archived as "isArchived",
                is_draft as "isDraft", tags, created_at as "createdAt", updated_at as "updatedAt"
    `;

    const { rows } = await db.query(query, values);
    return rows[0] || null;
  } catch (error) {
    console.error("Error updating document:", error);
    return null;
  }
}

export async function deleteDocumentAction(userId: string, docId: string): Promise<boolean> {
  try {
    const query = `
      DELETE FROM public.career_documents
      WHERE id = $1 AND user_id = $2
    `;
    const { rowCount } = await db.query(query, [docId, userId]);
    return (rowCount ?? 0) > 0;
  } catch (error) {
    console.error("Error deleting document:", error);
    return false;
  }
}

export async function duplicateDocumentAction(userId: string, docId: string): Promise<CareerDocument | null> {
  try {
    const doc = await getDocumentByIdAction(userId, docId);
    if (!doc) throw new Error("Document not found");

    const query = `
      INSERT INTO public.career_documents (
        user_id, title, document_type, resume_id, folder_id, content, meta_config,
        is_favorite, is_pinned, is_archived, is_draft, tags
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, false, false, false, $8, $9)
      RETURNING id, user_id as "userId", resume_id as "resumeId", folder_id as "folderId",
                document_type as "documentType", title, content, meta_config as "metaConfig",
                is_favorite as "isFavorite", is_pinned as "isPinned", is_archived as "isArchived",
                is_draft as "isDraft", tags, created_at as "createdAt", updated_at as "updatedAt"
    `;

    const values = [
      userId,
      `${doc.title} (Copy)`,
      doc.documentType,
      doc.resumeId || null,
      doc.folderId || null,
      doc.content,
      JSON.stringify(doc.metaConfig),
      doc.isDraft,
      doc.tags,
    ];

    const { rows } = await db.query(query, values);
    return rows[0] || null;
  } catch (error) {
    console.error("Error duplicating document:", error);
    return null;
  }
}

// ==========================================
// 3. VERSION OPERATIONS
// ==========================================

export async function getDocumentVersionsAction(userId: string, docId: string): Promise<CareerDocumentVersion[]> {
  try {
    // Ownership check
    const checkQuery = `SELECT 1 FROM public.career_documents WHERE id = $1 AND user_id = $2`;
    const { rows: checkRows } = await db.query(checkQuery, [docId, userId]);
    if (checkRows.length === 0) return [];

    const query = `
      SELECT id, document_id as "documentId", version_number as "versionNumber",
             content, meta_config as "metaConfig", created_at as "createdAt"
      FROM public.career_document_versions
      WHERE document_id = $1
      ORDER BY version_number DESC
    `;
    const { rows } = await db.query(query, [docId]);
    return rows;
  } catch (error) {
    console.error("Error fetching document versions:", error);
    return [];
  }
}

export async function createVersionSnapshotAction(
  userId: string,
  docId: string,
  content: string,
  metaConfig: any
): Promise<CareerDocumentVersion | null> {
  try {
    // Ownership check
    const checkQuery = `SELECT 1 FROM public.career_documents WHERE id = $1 AND user_id = $2`;
    const { rows: checkRows } = await db.query(checkQuery, [docId, userId]);
    if (checkRows.length === 0) throw new Error("Unauthorized or document not found");

    // Fetch next version number
    const verQuery = `
      SELECT COALESCE(MAX(version_number), 0) + 1 as "nextVer"
      FROM public.career_document_versions
      WHERE document_id = $1
    `;
    const { rows: verRows } = await db.query(verQuery, [docId]);
    const nextVer = verRows[0].nextVer;

    const query = `
      INSERT INTO public.career_document_versions (document_id, version_number, content, meta_config)
      VALUES ($1, $2, $3, $4)
      RETURNING id, document_id as "documentId", version_number as "versionNumber",
                content, meta_config as "metaConfig", created_at as "createdAt"
    `;
    const { rows } = await db.query(query, [docId, nextVer, content, JSON.stringify(metaConfig)]);
    return rows[0] || null;
  } catch (error) {
    console.error("Error creating version snapshot:", error);
    return null;
  }
}

export async function restoreVersionAction(
  userId: string,
  docId: string,
  versionId: string
): Promise<CareerDocument | null> {
  try {
    // Ownership check
    const checkQuery = `SELECT 1 FROM public.career_documents WHERE id = $1 AND user_id = $2`;
    const { rows: checkRows } = await db.query(checkQuery, [docId, userId]);
    if (checkRows.length === 0) throw new Error("Unauthorized or document not found");

    // Fetch version data
    const verQuery = `
      SELECT content, meta_config
      FROM public.career_document_versions
      WHERE id = $1 AND document_id = $2
    `;
    const { rows: verRows } = await db.query(verQuery, [versionId, docId]);
    if (verRows.length === 0) throw new Error("Version not found");

    const { content, meta_config } = verRows[0];

    // Update document
    const query = `
      UPDATE public.career_documents
      SET content = $1, meta_config = $2, updated_at = now()
      WHERE id = $3 AND user_id = $4
      RETURNING id, user_id as "userId", resume_id as "resumeId", folder_id as "folderId",
                document_type as "documentType", title, content, meta_config as "metaConfig",
                is_favorite as "isFavorite", is_pinned as "isPinned", is_archived as "isArchived",
                is_draft as "isDraft", tags, created_at as "createdAt", updated_at as "updatedAt"
    `;
    const { rows } = await db.query(query, [content, JSON.stringify(meta_config), docId, userId]);
    return rows[0] || null;
  } catch (error) {
    console.error("Error restoring version:", error);
    return null;
  }
}

// ==========================================
// 4. SHARING OPERATIONS
// ==========================================

export async function getDocumentShareSettingsAction(userId: string, docId: string): Promise<CareerDocumentShare | null> {
  try {
    // Ownership check
    const checkQuery = `SELECT title FROM public.career_documents WHERE id = $1 AND user_id = $2`;
    const { rows: checkRows } = await db.query(checkQuery, [docId, userId]);
    if (checkRows.length === 0) return null;

    const query = `SELECT * FROM public.career_document_shares WHERE document_id = $1`;
    const { rows } = await db.query(query, [docId]);

    if (rows.length === 0) {
      // Auto-generate default share configurations
      const baseName = checkRows[0].title || "document";
      const slugified = baseName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const uniqueSlug = `${slugified}-${docId.substring(0, 8)}`;

      const insertQuery = `
        INSERT INTO public.career_document_shares (
          document_id, unique_slug, visibility, password_hash, download_allowed, print_allowed
        )
        VALUES ($1, $2, 'private', null, true, true)
        RETURNING id, document_id as "documentId", unique_slug as "uniqueSlug", visibility,
                  password_hash as "passwordHash", download_allowed as "downloadAllowed",
                  print_allowed as "printAllowed", created_at as "createdAt", updated_at as "updatedAt"
      `;
      const { rows: insertRows } = await db.query(insertQuery, [docId, uniqueSlug]);
      return insertRows[0] || null;
    }

    const row = rows[0];
    return {
      id: row.id,
      documentId: row.document_id,
      uniqueSlug: row.unique_slug,
      visibility: row.visibility,
      passwordHash: row.password_hash,
      downloadAllowed: row.download_allowed,
      printAllowed: row.print_allowed,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    console.error("Error fetching document share settings:", error);
    return null;
  }
}

export async function updateDocumentShareSettingsAction(
  userId: string,
  docId: string,
  data: {
    visibility: "public" | "private" | "password";
    password?: string;
    downloadAllowed: boolean;
    printAllowed: boolean;
    uniqueSlug?: string;
  }
): Promise<CareerDocumentShare | null> {
  try {
    // 1. Verify document ownership
    const checkQuery = `SELECT title FROM public.career_documents WHERE id = $1 AND user_id = $2`;
    const { rows: checkRows } = await db.query(checkQuery, [docId, userId]);
    if (checkRows.length === 0) throw new Error("Unauthorized or document not found");

    // 2. Generate slug if not provided
    let slug = data.uniqueSlug?.trim();
    if (!slug) {
      const baseName = checkRows[0].title || "document";
      const slugified = baseName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      slug = `${slugified}-${docId.substring(0, 8)}`;
    }

    // 3. Format password
    let passwordHash: string | null = null;
    if (data.visibility === "password" && data.password) {
      passwordHash = hashPassword(data.password);
    }

    // 4. Check if settings exist
    const existQuery = `SELECT id, password_hash FROM public.career_document_shares WHERE document_id = $1`;
    const { rows: existRows } = await db.query(existQuery, [docId]);

    let finalQuery = "";
    let values: any[] = [];

    if (existRows.length > 0) {
      // If we don't supply a new password in password mode, keep the old hash
      const finalHash =
        data.visibility === "password" && !data.password
          ? existRows[0].password_hash
          : passwordHash;

      finalQuery = `
        UPDATE public.career_document_shares
        SET unique_slug = $1, visibility = $2, password_hash = $3,
            download_allowed = $4, print_allowed = $5, updated_at = now()
        WHERE document_id = $6
        RETURNING id, document_id as "documentId", unique_slug as "uniqueSlug", visibility,
                  password_hash as "passwordHash", download_allowed as "downloadAllowed",
                  print_allowed as "printAllowed", created_at as "createdAt", updated_at as "updatedAt"
      `;
      values = [slug, data.visibility, finalHash, data.downloadAllowed, data.printAllowed, docId];
    } else {
      finalQuery = `
        INSERT INTO public.career_document_shares (
          document_id, unique_slug, visibility, password_hash, download_allowed, print_allowed
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, document_id as "documentId", unique_slug as "uniqueSlug", visibility,
                  password_hash as "passwordHash", download_allowed as "downloadAllowed",
                  print_allowed as "printAllowed", created_at as "createdAt", updated_at as "updatedAt"
      `;
      values = [docId, slug, data.visibility, passwordHash, data.downloadAllowed, data.printAllowed];
    }

    const { rows } = await db.query(finalQuery, values);
    return rows[0] || null;
  } catch (error) {
    console.error("Error updating document sharing settings:", error);
    return null;
  }
}

export async function getPublicDocumentBySlugAction(
  slug: string,
  passwordInput?: string
): Promise<{
  success: boolean;
  error?: "not_found" | "private" | "password_required" | "password_invalid" | "server_error";
  document?: CareerDocument;
  settings?: {
    downloadAllowed: boolean;
    printAllowed: boolean;
    uniqueSlug: string;
  };
}> {
  try {
    // 1. Fetch link settings
    const shareQuery = `SELECT * FROM public.career_document_shares WHERE unique_slug = $1`;
    const { rows: shareRows } = await db.query(shareQuery, [slug]);
    if (shareRows.length === 0) {
      return { success: false, error: "not_found" };
    }

    const shareSettings = shareRows[0];

    // 2. Enforce Visibility Private
    if (shareSettings.visibility === "private") {
      return { success: false, error: "private" };
    }

    // 3. Enforce Password Access
    if (shareSettings.visibility === "password") {
      if (!passwordInput) {
        return { success: false, error: "password_required" };
      }
      const hashedInput = hashPassword(passwordInput);
      if (hashedInput !== shareSettings.password_hash) {
        return { success: false, error: "password_invalid" };
      }
    }

    // 4. Fetch the actual career document (ignoring user_id boundaries since it is a public share)
    const docQuery = `
      SELECT id, user_id as "userId", resume_id as "resumeId", folder_id as "folderId",
             document_type as "documentType", title, content, meta_config as "metaConfig",
             is_favorite as "isFavorite", is_pinned as "isPinned", is_archived as "isArchived",
             is_draft as "isDraft", tags, created_at as "createdAt", updated_at as "updatedAt"
      FROM public.career_documents
      WHERE id = $1
    `;
    const { rows: docRows } = await db.query(docQuery, [shareSettings.document_id]);
    if (docRows.length === 0) {
      return { success: false, error: "not_found" };
    }

    return {
      success: true,
      document: docRows[0],
      settings: {
        downloadAllowed: shareSettings.download_allowed,
        printAllowed: shareSettings.print_allowed,
        uniqueSlug: shareSettings.unique_slug,
      },
    };
  } catch (error) {
    console.error("Error fetching public document by slug:", error);
    return { success: false, error: "server_error" };
  }
}
