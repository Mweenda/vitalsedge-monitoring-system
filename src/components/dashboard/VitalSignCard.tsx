import React from "react";
import { clsx } from "clsx";

export interface VitalSignCardProps {
  label: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  status: "normal" | "alert" | "warning";
}

export const VitalSignCard: React.FC<VitalSignCardProps> = ({
  label,
  value,
  unit,
  icon,
  status,
}) => (
  <div
    className={clsx(
      "flex flex-col gap-2 rounded-2xl border bg-white p-5 shadow-lg hover:shadow-xl transition-shadow duration-300",
      status === "normal" && "border-neutral-200",
      status === "alert" && "border-red-200 ring-1 ring-red-100",
      status === "warning" && "border-amber-200 ring-1 ring-amber-100",
    )}
  >
    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-neutral-500">
      <span>{label}</span>
      <span className="text-neutral-400">{icon}</span>
    </div>
    <div className="font-mono text-2xl tabular-nums text-neutral-900">
      {value}{" "}
      <span className="text-sm font-normal text-neutral-500">{unit}</span>
    </div>
  </div>
);
