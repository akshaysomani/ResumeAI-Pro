"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, ChevronLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 text-center">
      <div className="space-y-4 max-w-md">
        <div className="mx-auto rounded-full bg-zinc-100 dark:bg-zinc-900 p-4 h-16 w-16 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
          <FileQuestion className="h-8 w-8 text-zinc-400" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Page Not Found</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          The requested URL path was not found in this application directory workspace.
        </p>
        <div className="pt-4">
          <Link href="/">
            <Button className="h-10 text-xs font-semibold px-4">
              <ChevronLeft className="mr-1 h-4 w-4" /> Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
