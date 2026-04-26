import React from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => (
  <div
    className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-slate-900/40 px-6 py-16 text-center"
    role="status"
  >
    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 shadow-sm ring-1 ring-white/10">
      <Icon className="h-8 w-8 text-emerald-400" aria-hidden />
    </div>
    <h2 className="text-lg font-semibold text-white">{title}</h2>
    <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">
      {description}
    </p>
    {action && (
      <Button
        type="button"
        variant={action.variant ?? "primary"}
        className="mt-8"
        onClick={action.onClick}
      >
        {action.label}
      </Button>
    )}
  </div>
);
