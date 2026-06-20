import React from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { db } from "@/lib/db";
import {
  getRecruiterCandidatesAction,
  getRecruiterFeedbackAction
} from "@/app/actions/orgActions";
import RecruiterClient from "./recruiter-client";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RecruiterPortalPage({ params }: PageProps) {
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

  // Guard access to specific roles: owner, admin, manager, recruiter, hiring_manager
  const allowedRoles = ["owner", "admin", "manager", "recruiter", "hiring_manager"];
  if (!allowedRoles.includes(role)) {
    redirect(`/dashboard/organizations/${orgId}/workspaces`);
  }

  // 4. Fetch candidates list & recruiter feedbacks
  const candidates = await getRecruiterCandidatesAction(orgId);
  const feedbacks = await getRecruiterFeedbackAction(orgId);

  return (
    <RecruiterClient
      orgId={orgId}
      role={role}
      userId={user.id}
      initialCandidates={candidates}
      initialFeedbacks={feedbacks}
    />
  );
}
