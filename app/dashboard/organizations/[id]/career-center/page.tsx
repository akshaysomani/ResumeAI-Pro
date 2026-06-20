import React from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { db } from "@/lib/db";
import {
  getResumeReviewRequestsAction,
  getPlacementRecordsAction,
  getOrgWorkspacesAction
} from "@/app/actions/orgActions";
import CareerCenterClient from "./career-center-client";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CareerCenterPage({ params }: PageProps) {
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

  // Guard access: owner, admin, manager, career_coach
  const allowedRoles = ["owner", "admin", "manager", "career_coach"];
  if (!allowedRoles.includes(role)) {
    redirect(`/dashboard/organizations/${orgId}/workspaces`);
  }

  // 4. Fetch workspaces
  const workspaces = await getOrgWorkspacesAction(orgId);

  // We want to find a workspace of type 'university' or 'career_center', or default to the first workspace
  const universityWs = workspaces.find((w) => ["university", "career_center"].includes(w.type)) || workspaces[0];

  if (!universityWs) {
    // If no workspaces at all, redirect to workspaces to create one
    redirect(`/dashboard/organizations/${orgId}/workspaces`);
  }

  // 5. Fetch reviews queue & placements logs
  const reviews = await getResumeReviewRequestsAction(universityWs.id);
  const placements = await getPlacementRecordsAction(universityWs.id);

  // Fetch all students (profiles) for the placement logger dropdown selection
  const studentsRes = await db.query(
    `SELECT p.id, p.full_name as "fullName", p.email FROM public.profiles p ORDER BY p.full_name ASC LIMIT 50`
  );
  const students = studentsRes.rows;

  return (
    <CareerCenterClient
      orgId={orgId}
      role={role}
      userId={user.id}
      workspaceId={universityWs.id}
      initialReviews={reviews}
      initialPlacements={placements}
      studentsList={students}
    />
  );
}
