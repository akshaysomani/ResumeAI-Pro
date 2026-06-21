import React from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getAutomationRulesAction, getAutomationExecutionsAction } from "@/app/actions/platformActions";
import AutomationsClient from "./automations-client";

export const revalidate = 0;

export default async function AutomationsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const userId = user.id;

  const [rules, executions] = await Promise.all([
    getAutomationRulesAction(userId),
    getAutomationExecutionsAction(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-50">
          Automations Workspace
        </h2>
        <p className="text-sm text-zinc-400">
          Design custom trigger-action pipelines. Automatically send Slack notifications when a resume is updated, sync backup files, or alert team members of career coach feedback.
        </p>
      </div>
      <AutomationsClient userId={userId} initialRules={rules} initialExecutions={executions} />
    </div>
  );
}
