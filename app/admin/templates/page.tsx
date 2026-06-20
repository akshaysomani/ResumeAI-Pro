import React from "react";
import { getAdminTemplatesAction } from "@/app/actions/adminActions";
import TemplatesClient from "./templates-client";

export const revalidate = 0;

export default async function AdminTemplatesPage() {
  const templates = await getAdminTemplatesAction();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-50">
          Template Access Manager
        </h2>
        <p className="text-sm text-zinc-400">
          Toggle resume template premium access tiers, review download statistics, and inspect template categories.
        </p>
      </div>
      <TemplatesClient initialTemplates={templates} />
    </div>
  );
}
