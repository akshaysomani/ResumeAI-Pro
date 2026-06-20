import React from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getOrganizationsAction } from "@/app/actions/orgActions";
import OrganizationsClient from "./organizations-client";

export const revalidate = 0;

export default async function OrganizationsDirectoryPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth");
  }

  const orgs = await getOrganizationsAction(user.id);

  return (
    <div className="space-y-6">
      <OrganizationsClient initialOrgs={orgs} />
    </div>
  );
}
