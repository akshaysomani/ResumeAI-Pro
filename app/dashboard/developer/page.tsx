import React from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  getApiKeysAction,
  getOAuthAppsAction,
  getWebhookEndpointsAction,
} from "@/app/actions/platformActions";
import DeveloperClient from "./developer-client";

export const revalidate = 0;

export default async function DeveloperPortalPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const userId = user.id;

  // Parallel fetch initial developer portal records
  const [apiKeys, oauthApps, webhooks] = await Promise.all([
    getApiKeysAction(userId),
    getOAuthAppsAction(userId),
    getWebhookEndpointsAction(userId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-50">
          Developer Portal
        </h2>
        <p className="text-sm text-zinc-400">
          Configure secure API keys, manage client OAuth applications, and set up webhook endpoints to build custom integrations.
        </p>
      </div>
      <DeveloperClient
        userId={userId}
        initialApiKeys={apiKeys}
        initialOAuthApps={oauthApps}
        initialWebhooks={webhooks}
      />
    </div>
  );
}
