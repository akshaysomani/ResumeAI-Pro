import React from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { db } from "@/lib/db";
import { getOrgWorkspacesAction } from "@/app/actions/orgActions";
import AssetsClient from "./assets-client";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SharedAssetsPage({ params }: PageProps) {
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

  // 4. Fetch workspaces
  const workspaces = await getOrgWorkspacesAction(orgId);

  return (
    <AssetsClient
      orgId={orgId}
      role={role}
      userId={user.id}
      workspaces={workspaces}
    />
  );
}
