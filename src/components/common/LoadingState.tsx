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
    className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-8 shadow-lg"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <Loader2
      className="h-10 w-10 animate-spin text-emerald-400"
      aria-hidden
    />
    <p className="text-sm font-medium text-white">{message}</p>
    {submessage && (
      <p className="max-w-sm text-center text-xs text-slate-400">
        {submessage}
      </p>
    )}
  </div>
);
