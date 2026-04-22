import React from "react";
import { Loader2 } from "lucide-react";

export interface LoadingStateProps {
  message?: string;
  submessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading…",
  submessage,
}) => (
  <div
    className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-lg border border-neutral-200 bg-white dark:bg-neutral-900 dark:border-neutral-800 p-8 shadow-sm"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <Loader2
      className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400"
      aria-hidden
    />
    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{message}</p>
    {submessage && (
      <p className="max-w-sm text-center text-xs text-neutral-500 dark:text-neutral-400">
        {submessage}
      </p>
    )}
  </div>
);
