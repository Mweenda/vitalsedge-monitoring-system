import React from "react";
import { clsx } from "clsx";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = "md",
}) => (
  <div
    className={clsx(
      "rounded-2xl border border-white/40 bg-white/70 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/60",
      paddingMap[padding],
      className,
    )}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, className }) => (
  <div
    className={clsx(
      "mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-white/20 dark:border-white/5 pb-4",
      className,
    )}
  >
    <div>
      <h3 className="text-base font-bold tracking-tight text-neutral-900 dark:text-white">{title}</h3>
      {subtitle && (
        <p className="mt-0.5 text-sm font-medium text-neutral-600 dark:text-neutral-400">{subtitle}</p>
      )}
    </div>
    {action}
  </div>
);
