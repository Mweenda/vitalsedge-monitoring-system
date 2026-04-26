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
      "rounded-xl border border-white/10 bg-slate-900/60 shadow-lg",
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
      "mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4",
      className,
    )}
  >
    <div>
      <h3 className="text-base font-bold text-white">{title}</h3>
      {subtitle && (
        <p className="mt-0.5 text-sm font-medium text-slate-400">{subtitle}</p>
      )}
    </div>
    {action}
  </div>
);
