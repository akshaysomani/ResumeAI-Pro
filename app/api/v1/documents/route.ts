import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withApiAuth } from "@/lib/api-auth";
import { triggerAutomation } from "@/lib/automation-engine";

export async function GET(req: NextRequest) {
  return withApiAuth(req, "read:documents", async (userId) => {
    try {
      const res = await db.query(
        `SELECT id, user_id as "userId", resume_id as "resumeId", folder_id as "folderId", 
                document_type as "documentType", title, content, meta_config as "metaConfig", 
                is_favorite as "isFavorite", is_pinned as "isPinned", is_archived as "isArchived", 
                is_draft as "isDraft", tags, created_at as "createdAt", updated_at as "updatedAt"
         FROM public.career_documents 
         WHERE user_id = $1 
         ORDER BY updated_at DESC`,
        [userId]
      );
      return NextResponse.json({ data: res.rows });
    } catch (error: any) {
      console.error("GET /api/v1/documents error:", error);
      return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
    }
  });
}

export async function POST(req: NextRequest) {
  return withApiAuth(req, "write:documents", async (userId) => {
    try {
      const body = await req.json();
      const {
        title,
        documentType,
        content = "",
        resumeId = null,
        folderId = null,
        metaConfig = {},
        tags = [],
        isDraft = true,
      } = body;

      if (!title || !documentType) {
        return NextResponse.json(
          { error: "Missing required fields: title, documentType" },
          { status: 400 }
        );
      }

      const res = await db.query(
        `INSERT INTO public.career_documents (
          user_id, resume_id, folder_id, document_type, title, content, meta_config, tags, is_draft
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         RETURNING id, user_id as "userId", resume_id as "resumeId", folder_id as "folderId", 
                   document_type as "documentType", title, content, meta_config as "metaConfig", 
                   is_favorite as "isFavorite", is_pinned as "isPinned", is_archived as "isArchived", 
                   is_draft as "isDraft", tags, created_at as "createdAt", updated_at as "updatedAt"`,
        [
          userId,
          resumeId,
          folderId,
          documentType,
          title,
          content,
          JSON.stringify(metaConfig),
          tags,
          isDraft,
        ]
      );

      const newDoc = res.rows[0];

      // Fire automation trigger
      triggerAutomation({
        userId,
        event: "document.created",
        data: {
          document: newDoc,
        },
      }).catch((e) => console.error("Automation trigger error:", e));

      return NextResponse.json({ data: newDoc }, { status: 201 });
    } catch (error: any) {
      console.error("POST /api/v1/documents error:", error);
      return NextResponse.json({ error: "Failed to create document or invalid payload" }, { status: 500 });
    }
  });
}
