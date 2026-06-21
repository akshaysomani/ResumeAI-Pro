import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withApiAuth } from "@/lib/api-auth";
import { triggerAutomation } from "@/lib/automation-engine";

export async function GET(req: NextRequest) {
  return withApiAuth(req, "read:resumes", async (userId) => {
    try {
      const res = await db.query(
        `SELECT id, title, description, color_theme as "colorTheme", font_family as "fontFamily", 
                paper_size as "paperSize", page_margin as "pageMargin", layout_style as "layoutStyle", 
                created_at as "createdAt", updated_at as "updatedAt"
         FROM public.resumes 
         WHERE user_id = $1 
         ORDER BY updated_at DESC`,
        [userId]
      );
      return NextResponse.json({ data: res.rows });
    } catch (error: any) {
      console.error("GET /api/v1/resumes error:", error);
      return NextResponse.json({ error: "Failed to fetch resumes" }, { status: 500 });
    }
  });
}

export async function POST(req: NextRequest) {
  return withApiAuth(req, "write:resumes", async (userId) => {
    try {
      const body = await req.json();
      const { title, description = "", config = {} } = body;

      if (!title) {
        return NextResponse.json({ error: "Missing required field: title" }, { status: 400 });
      }

      // Create resume
      const resumeRes = await db.query(
        `INSERT INTO public.resumes (
          user_id, title, description, color_theme, font_family, paper_size, page_margin, layout_style
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING id, title, description, color_theme as "colorTheme", font_family as "fontFamily", 
                   paper_size as "paperSize", page_margin as "pageMargin", layout_style as "layoutStyle", 
                   created_at as "createdAt", updated_at as "updatedAt"`,
        [
          userId,
          title,
          description,
          config.colorTheme || "zinc",
          config.fontFamily || "Inter",
          config.paperSize || "a4",
          config.pageMargin || "normal",
          config.layoutStyle || "modern",
        ]
      );

      const newResume = resumeRes.rows[0];

      // Auto-insert default empty sections or personal info row to match resume-canvas constraints
      try {
        await db.query(
          `INSERT INTO public.personal_information (resume_id) VALUES ($1) ON CONFLICT DO NOTHING`,
          [newResume.id]
        );
      } catch (err) {
        console.error("Error inserting personal info row during API creation:", err);
      }

      // Fire automation trigger
      triggerAutomation({
        userId,
        event: "resume.created",
        data: {
          resume: newResume,
        },
      }).catch((e) => console.error("Automation trigger error:", e));

      return NextResponse.json({ data: newResume }, { status: 201 });
    } catch (error: any) {
      console.error("POST /api/v1/resumes error:", error);
      return NextResponse.json({ error: "Failed to create resume or invalid payload" }, { status: 500 });
    }
  });
}
