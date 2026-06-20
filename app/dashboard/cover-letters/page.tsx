"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CoverLettersRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/documents");
  }, [router]);

  return (
    <div className="flex h-48 w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <p className="text-xs text-zinc-500">Redirecting to Career Documents...</p>
      </div>
    </div>
  );
}
