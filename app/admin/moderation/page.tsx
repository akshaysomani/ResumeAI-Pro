import React from "react";
import { getReportedItemsAction } from "@/app/actions/adminActions";
import ModerationClient from "./moderation-client";

export const revalidate = 0;

export default async function AdminModerationPage() {
  const reports = await getReportedItemsAction();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-50">
          Content Moderation Board
        </h2>
        <p className="text-sm text-zinc-400">
          Review community reports on shared user profiles and resumes, examine violation reasons, and block content.
        </p>
      </div>
      <ModerationClient initialReports={reports} />
    </div>
  );
}
