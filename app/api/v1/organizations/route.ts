import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withApiAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  return withApiAuth(req, "read:organizations", async (userId) => {
    try {
      const res = await db.query(
        `SELECT o.id, o.name, o.logo_url as "logoUrl", o.description, o.branding, 
                o.owner_id as "ownerId", o.created_at as "createdAt", o.updated_at as "updatedAt",
                CASE WHEN o.owner_id = $1 THEN 'owner' ELSE om.role END as "memberRole"
         FROM public.organizations o
         LEFT JOIN public.organization_members om ON o.id = om.organization_id AND om.user_id = $1
         WHERE o.owner_id = $1 OR (om.user_id = $1 AND om.status = 'active')
         ORDER BY o.created_at DESC`,
        [userId]
      );
      return NextResponse.json({ data: res.rows });
    } catch (error: any) {
      console.error("GET /api/v1/organizations error:", error);
      return NextResponse.json({ error: "Failed to fetch organizations" }, { status: 500 });
    }
  });
}

export async function POST(req: NextRequest) {
  return withApiAuth(req, "write:organizations", async (userId) => {
    const client = await db.connect();
    try {
      const body = await req.json();
      const { name, description = "", branding = {}, logoUrl = null } = body;

      if (!name) {
        return NextResponse.json({ error: "Missing required field: name" }, { status: 400 });
      }

      await client.query("BEGIN");

      // 1. Insert organization
      const orgQuery = `
        INSERT INTO public.organizations (name, description, branding, logo_url, owner_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, description, branding, logo_url as "logoUrl", owner_id as "ownerId", created_at as "createdAt"
      `;
      const orgRes = await client.query(orgQuery, [
        name,
        description,
        JSON.stringify(branding),
        logoUrl,
        userId,
      ]);
      const newOrg = orgRes.rows[0];

      // 2. Insert member owner entry
      await client.query(
        `INSERT INTO public.organization_members (organization_id, user_id, role, status)
         VALUES ($1, $2, 'owner', 'active')`,
        [newOrg.id, userId]
      );

      // 3. Insert default workspace
      const workspaceQuery = `
        INSERT INTO public.workspaces (organization_id, name, type)
        VALUES ($1, $2, 'startup')
        RETURNING id, name, type
      `;
      const workspaceRes = await client.query(workspaceQuery, [newOrg.id, `${name} Workspace`]);
      const newWorkspace = workspaceRes.rows[0];

      // 4. Create organization billing config
      await client.query(
        `INSERT INTO public.organization_billing (organization_id, plan_type, seats)
         VALUES ($1, 'free', 5)`,
        [newOrg.id]
      );

      await client.query("COMMIT");

      return NextResponse.json(
        {
          data: {
            ...newOrg,
            defaultWorkspace: newWorkspace,
          },
        },
        { status: 201 }
      );
    } catch (error: any) {
      await client.query("ROLLBACK");
      console.error("POST /api/v1/organizations error:", error);
      return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
    } finally {
      client.release();
    }
  });
}
