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
      "rounded-xl border border-gray-200 bg-white p-5 shadow-sm",
      className,
    )}
  >
    <div className="mb-4 flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 pb-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-sm text-gray-600">{subtitle}</p>
        )}
      </div>
    </div>
    <div
      className={clsx(
        "min-h-[300px] w-full rounded-lg border border-gray-100 bg-gray-50 p-3",
        chartClassName,
      )}
    >
      {children}
    </div>
  </section>
);
