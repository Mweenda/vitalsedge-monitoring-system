import React from "react";
import { clsx } from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-emerald-500 text-slate-950 shadow-sm hover:bg-emerald-600 focus-visible:ring-emerald-500",
  secondary:
    "border border-white/10 bg-slate-800/60 text-slate-200 shadow-sm hover:bg-slate-800 focus-visible:ring-slate-400",
  ghost:
    "text-slate-400 hover:bg-slate-800 hover:text-slate-200 focus-visible:ring-slate-400",
  danger:
    "bg-red-500 text-white shadow-sm hover:bg-red-600 focus-visible:ring-red-500",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-1.5 text-xs font-semibold rounded-md",
  md: "min-h-11 px-4 py-2.5 text-sm font-semibold rounded-lg",
  lg: "min-h-12 px-5 py-3 text-sm font-semibold rounded-lg",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", className, type = "button", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={clsx(
          "inline-flex items-center justify-center gap-2 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-200 disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);
