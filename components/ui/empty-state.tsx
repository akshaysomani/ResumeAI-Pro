import React from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200/80 bg-zinc-50/30 p-8 text-center dark:border-zinc-800/80 dark:bg-zinc-950/20">
      <div className="rounded-full bg-zinc-100 p-4 dark:bg-zinc-900">
        <Icon className="h-8 w-8 text-zinc-400 dark:text-zinc-600" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
      {actionText && onAction && (
        <Button onClick={onAction} className="mt-6" size="sm">
          {actionText}
        </Button>
      )}
    </div>
  );
}
