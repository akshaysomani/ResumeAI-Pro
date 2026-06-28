import React from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getImportHistoryAction } from "@/app/actions/platformActions";
import ResumeImportClient from "./import-client";

export const revalidate = 0;

export default async function ResumeImportPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const userId = user.id;
  const initialImports = await getImportHistoryAction(userId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Import Resume Wizard
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Upload existing PDF/DOCX resumes, sync profiles from GitHub or LinkedIn, or import backup JSON files to instantly bootstrap or update your profile.
        </p>
      </div>
      <ResumeImportClient userId={userId} initialImports={initialImports} />
    </div>
  );
}
