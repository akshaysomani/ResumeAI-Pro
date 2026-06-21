import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withApiAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  return withApiAuth(req, "read:templates", async () => {
    try {
      const res = await db.query(
        `SELECT id, name, slug, thumbnail_url as "thumbnailUrl", category, 
                is_premium as "isPremium", popularity, downloads 
         FROM public.templates 
         ORDER BY popularity DESC`
      );
      return NextResponse.json({ data: res.rows });
    } catch (error: any) {
      console.error("GET /api/v1/templates error:", error);
      return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
    }
  });
}
