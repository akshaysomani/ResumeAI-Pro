import React from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { db } from "@/lib/db";
import AnalyticsClient from "./analytics-client";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamAnalyticsPage({ params }: PageProps) {
  const { id: orgId } = await params;

  // 1. Authenticate user
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth");
  }

  // 2. Fetch organization details
  const dbOrg = await db.query("SELECT * FROM public.organizations WHERE id = $1", [orgId]);
  if (dbOrg.rows.length === 0) {
    redirect("/dashboard/organizations");
  }
  const org = dbOrg.rows[0];

  // 3. Fetch user membership details
  const dbMember = await db.query(
    "SELECT role FROM public.organization_members WHERE organization_id = $1 AND user_id = $2",
    [orgId, user.id]
  );
  
  const isOwner = org.owner_id === user.id;
  if (dbMember.rows.length === 0 && !isOwner) {
    redirect("/dashboard/organizations");
  }

  const role = isOwner ? "owner" : dbMember.rows[0]?.role || "viewer";

  // Guard access: owner, admin, manager
  const allowedRoles = ["owner", "admin", "manager"];
  if (!allowedRoles.includes(role)) {
    redirect(`/dashboard/organizations/${orgId}/workspaces`);
  }

  // 4. Query Resume Counts per Workspace
  const resumesQuery = `
    SELECT w.id, w.name, w.type, COUNT(r.id)::int as count 
    FROM public.workspaces w 
    LEFT JOIN public.resumes r ON w.id = r.workspace_id 
    WHERE w.organization_id = $1 
    GROUP BY w.id, w.name, w.type
    ORDER BY count DESC
  `;
  const { rows: workspacesData } = await db.query(resumesQuery, [orgId]);

  // 5. Query AI Credits Usage
  // We check for table existence by selecting from it; if table doesn't have rows or fails, we fallback gracefully
  let aiUsageData = [];
  try {
    const usageQuery = `
      SELECT au.action_type as type, COUNT(au.id)::int as total
      FROM public.ai_usage au
      JOIN public.organization_members om ON au.user_id = om.user_id
      WHERE om.organization_id = $1
      GROUP BY au.action_type
    `;
    const { rows } = await db.query(usageQuery, [orgId]);
    aiUsageData = rows;
  } catch (err) {
    console.error("AI usage query error:", err);
  }

  // 6. Query placements for salary tracker
  const placementsQuery = `
    SELECT pr.company_name as "companyName", pr.job_role as "jobRole", pr.package_lpa as "packageLpa", p.full_name as "studentName"
    FROM public.placement_records pr 
    JOIN public.profiles p ON pr.student_id = p.id 
    WHERE pr.workspace_id IN (
      SELECT id FROM public.workspaces WHERE organization_id = $1
    )
    ORDER BY pr.package_lpa DESC
    LIMIT 10
  `;
  const { rows: placementsData } = await db.query(placementsQuery, [orgId]);

  // 7. General stats
  const totalResumesRes = await db.query(
    `SELECT COUNT(r.id)::int as count FROM public.resumes r WHERE r.workspace_id IN (SELECT id FROM public.workspaces WHERE organization_id = $1)`,
    [orgId]
  );
  const totalResumes = totalResumesRes.rows[0]?.count || 0;

  const totalMembersRes = await db.query(
    `SELECT COUNT(user_id)::int as count FROM public.organization_members WHERE organization_id = $1`,
    [orgId]
  );
  const totalMembers = totalMembersRes.rows[0]?.count || 0;

  return (
    <AnalyticsClient
      orgId={orgId}
      role={role}
      totalResumes={totalResumes}
      totalMembers={totalMembers}
      workspacesData={workspacesData}
      aiUsageData={aiUsageData}
      placementsData={placementsData}
    />
  );
}
