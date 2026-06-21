import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { withApiAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  return withApiAuth(req, "read:webhooks", async (userId) => {
    try {
      const res = await db.query(
        `SELECT id, url, description, signing_secret as "signingSecret", events, 
                is_active as "isActive", failure_count as "failureCount", created_at as "createdAt" 
         FROM public.webhook_endpoints 
         WHERE user_id = $1 
         ORDER BY created_at DESC`,
        [userId]
      );
      return NextResponse.json({ data: res.rows });
    } catch (error: any) {
      console.error("GET /api/v1/webhooks error:", error);
      return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 });
    }
  });
}

export async function POST(req: NextRequest) {
  return withApiAuth(req, "write:webhooks", async (userId) => {
    try {
      const body = await req.json();
      const { url, description = "", events = ["resume.created", "resume.updated"] } = body;

      if (!url) {
        return NextResponse.json({ error: "Missing required field: url" }, { status: 400 });
      }

      const signingSecret = `whsec_${crypto.randomBytes(24).toString("hex")}`;

      const res = await db.query(
        `INSERT INTO public.webhook_endpoints (
          user_id, url, description, signing_secret, events
         ) VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, url, description, signing_secret as "signingSecret", events, 
                   is_active as "isActive", failure_count as "failureCount", created_at as "createdAt"`,
        [userId, url, description, signingSecret, events]
      );

      return NextResponse.json({ data: res.rows[0] }, { status: 201 });
    } catch (error: any) {
      console.error("POST /api/v1/webhooks error:", error);
      return NextResponse.json({ error: "Failed to create webhook endpoint" }, { status: 500 });
    }
  });
}
