import React from "react";
import { clsx } from "clsx";

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  chartClassName?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  className,
  chartClassName,
}) => (
  <section
    className={clsx(
      "rounded-2xl border border-neutral-200 bg-white p-5 shadow-lg hover:shadow-xl transition-shadow duration-300",
      className,
    )}
  >
    <div className="mb-4 flex flex-wrap items-start justify-between gap-2 border-b border-neutral-100 pb-4">
      <div>
        <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-sm text-neutral-600">{subtitle}</p>
        )}
      </div>
    </div>
    <div
      className={clsx(
        "min-h-[300px] w-full rounded-xl border border-neutral-100 bg-neutral-50/80 p-3",
        chartClassName,
      )}
    >
      {children}
    </div>
  </section>
);
