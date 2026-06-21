import React from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getIntegrationConfigsAction } from "@/app/actions/platformActions";
import IntegrationsClient from "./integrations-client";

export const revalidate = 0;

export default async function IntegrationsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const userId = user.id;
  const initialConfigs = await getIntegrationConfigsAction(userId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-50">
          Integrations Marketplace
        </h2>
        <p className="text-sm text-zinc-400">
          Connect your favorite third-party services to automatically sync resumes, export PDFs, post job applications, and schedule interview training.
        </p>
      </div>
      <IntegrationsClient userId={userId} initialConfigs={initialConfigs} />
    </div>
  );
}
