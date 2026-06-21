import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withApiAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  return withApiAuth(req, "read:users", async (userId) => {
    try {
      const res = await db.query(
        `SELECT id, email, full_name as "fullName", phone_number as "phoneNumber", 
                headline, location, bio, avatar_url as "avatarUrl", linkedin_url as "linkedinUrl", 
                github_url as "githubUrl", portfolio_url as "portfolioUrl", website, 
                created_at as "createdAt", updated_at as "updatedAt"
         FROM public.profiles 
         WHERE id = $1`,
        [userId]
      );

      if (res.rows.length === 0) {
        return NextResponse.json({ error: "User profile not found" }, { status: 404 });
      }

      return NextResponse.json({ data: res.rows[0] });
    } catch (error: any) {
      console.error("GET /api/v1/users error:", error);
      return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
    }
  });
}

export async function PATCH(req: NextRequest) {
  return withApiAuth(req, "write:users", async (userId) => {
    try {
      const body = await req.json();
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      const allowedFields = {
        fullName: "full_name",
        phoneNumber: "phone_number",
        headline: "headline",
        location: "location",
        bio: "bio",
        avatarUrl: "avatar_url",
        linkedinUrl: "linkedin_url",
        githubUrl: "github_url",
        portfolioUrl: "portfolio_url",
        website: "website",
      };

      for (const [key, columnName] of Object.entries(allowedFields)) {
        if (body[key] !== undefined) {
          fields.push(`${columnName} = $${paramIndex++}`);
          values.push(body[key]);
        }
      }

      if (fields.length === 0) {
        return NextResponse.json({ error: "No fields provided to update" }, { status: 400 });
      }

      values.push(userId);
      const query = `
        UPDATE public.profiles 
        SET ${fields.join(", ")}, updated_at = NOW() 
        WHERE id = $${paramIndex}
        RETURNING id, email, full_name as "fullName", phone_number as "phoneNumber", 
                  headline, location, bio, avatar_url as "avatarUrl", linkedin_url as "linkedinUrl", 
                  github_url as "githubUrl", portfolio_url as "portfolioUrl", website, 
                  created_at as "createdAt", updated_at as "updatedAt"
      `;

      const res = await db.query(query, values);
      return NextResponse.json({ data: res.rows[0] });
    } catch (error: any) {
      console.error("PATCH /api/v1/users error:", error);
      return NextResponse.json({ error: "Failed to update profile or invalid payload" }, { status: 500 });
    }
  });
}
